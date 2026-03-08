use std::collections::{HashMap, VecDeque};
use std::sync::Arc;

use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::{RwLock, Semaphore};

const MAX_CACHE_BYTES: usize = 1024 * 1024 * 1024; // 1 GiB

#[derive(Debug, Deserialize)]
pub struct PreloadRequest {
    pub urls: Vec<String>,
    pub concurrency: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct PreloadItemResult {
    pub url: String,
    pub success: bool,
    pub local_path: Option<String>, // 纯内存缓存场景固定为 None
    pub error: Option<String>,
}

#[derive(Default)]
struct MemoryCache {
    map: HashMap<String, Arc<Vec<u8>>>,
    order: VecDeque<String>, // FIFO / 近似 LRU
    total_bytes: usize,
}

impl MemoryCache {
    fn insert_with_evict(&mut self, key: String, value: Vec<u8>) {
        let new_size = value.len();

        if new_size > MAX_CACHE_BYTES {
            return;
        }

        // 替换已有 key 时先移除旧值
        if let Some(old) = self.map.remove(&key) {
            self.total_bytes = self.total_bytes.saturating_sub(old.len());
            self.order.retain(|k| k != &key);
        }

        // 超限淘汰
        while self.total_bytes + new_size > MAX_CACHE_BYTES {
            if let Some(oldest_key) = self.order.pop_front() {
                if let Some(old_val) = self.map.remove(&oldest_key) {
                    self.total_bytes = self.total_bytes.saturating_sub(old_val.len());
                }
            } else {
                break;
            }
        }

        self.total_bytes += new_size;
        self.order.push_back(key.clone());
        self.map.insert(key, Arc::new(value));
    }

    fn get_and_touch(&mut self, key: &str) -> Option<Arc<Vec<u8>>> {
        let v = self.map.get(key).cloned()?;
        self.order.retain(|k| k != key);
        self.order.push_back(key.to_string());
        Some(v)
    }
}

static IMAGE_CACHE: Lazy<RwLock<MemoryCache>> =
    Lazy::new(|| RwLock::new(MemoryCache::default()));

async fn fetch_bytes(client: &Client, url: &str) -> Result<Vec<u8>, String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} ({url})", resp.status()));
    }
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[tauri::command]
pub async fn preload_images(req: PreloadRequest) -> Result<Vec<PreloadItemResult>, String> {
    let concurrency = req.concurrency.unwrap_or(4).max(1);
    let sem = Arc::new(Semaphore::new(concurrency));
    let client = Client::new();
    let mut tasks = tokio::task::JoinSet::new();

    for url in req.urls {
        let c = client.clone();
        let s = sem.clone();
        tasks.spawn(async move {
            let url_for_err = url.clone();

            let _permit = s
                .acquire_owned()
                .await
                .map_err(|e| (url_for_err.clone(), e.to_string()))?;

            let bytes = fetch_bytes(&c, &url)
                .await
                .map_err(|e| (url_for_err.clone(), e))?;

            Ok::<(String, Vec<u8>), (String, String)>((url, bytes))
        });
    }

    let mut results = Vec::new();

    while let Some(joined) = tasks.join_next().await {
        match joined {
            Ok(Ok((url, bytes))) => {
                IMAGE_CACHE.write().await.insert_with_evict(url.clone(), bytes);
                results.push(PreloadItemResult {
                    url,
                    success: true,
                    local_path: None,
                    error: None,
                });
            }
            Ok(Err((url, err))) => {
                results.push(PreloadItemResult {
                    url,
                    success: false,
                    local_path: None,
                    error: Some(err),
                });
            }
            Err(err) => {
                results.push(PreloadItemResult {
                    url: String::new(),
                    success: false,
                    local_path: None,
                    error: Some(err.to_string()),
                });
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub async fn get_cached_image(url: String) -> Result<Vec<u8>, String> {
    // 先查缓存（命中则 touch）
    if let Some(hit) = IMAGE_CACHE.write().await.get_and_touch(&url) {
        return Ok((*hit).clone());
    }

    // 未命中则网络拉取并写入缓存
    let client = Client::new();
    let bytes = fetch_bytes(&client, &url).await?;
    IMAGE_CACHE
        .write()
        .await
        .insert_with_evict(url, bytes.clone());
    Ok(bytes)
}

/// 与前端 `invoke('get_image_bytes')` 兼容
#[tauri::command]
pub async fn get_image_bytes(url: String) -> Result<Vec<u8>, String> {
    get_cached_image(url).await
}
