use serde_json::{Value, json};
use reqwest::Client;
use urlencoding::encode;
use crate::discovery;

// 默认服务器地址（在没有发现服务器时使用）
const DEFAULT_API_BASE: &str = "http://192.168.31.123:5999";

fn get_api_base() -> String {
    discovery::get_server_address().unwrap_or_else(|| DEFAULT_API_BASE.to_string())
}

fn normalize_url(url: &str) -> String {
    if url.starts_with("http://") || url.starts_with("https://") {
        url.to_string()
    } else if url.starts_with('/') {
        url.to_string()
    } else {
        format!("/{}", url)
    }
}

fn process_cover_urls(v: Value) -> Value {
    match v {
        Value::Array(arr) => Value::Array(arr.into_iter().map(process_cover_urls).collect()),
        Value::Object(mut map) => {
            if let Some(Value::String(s)) = map.get("cover_url").cloned() {
                map.insert("cover_url".into(), Value::String(normalize_url(&s)));
            }
            Value::Object(map)
        }
        other => other
    }
}

async fn fetch_api(path: &str) -> Result<Value, String> {
    let api_base = get_api_base();
    let url = format!("{}{}", api_base, path);
    let client = Client::new();
    let resp = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    if !status.is_success() {
        return Err(format!("HTTP {}", status));
    }

    let data = resp.json::<Value>().await.map_err(|e| e.to_string())?;
    Ok(data)
}

#[tauri::command]
pub async fn get_manga_list() -> Result<Value, String> {
    let data = fetch_api("/api/manga").await?;
    let list = data.get("data")
        .and_then(|d| d.get("manga_list"))
        .cloned()
        .or_else(|| data.get("manga_list").cloned())
        .unwrap_or(json!([]));
    Ok(process_cover_urls(list))
}

#[tauri::command]
pub async fn get_manga_info(manga_name: String) -> Result<Value, String> {
    let path = format!("/api/manga/{}", encode(&manga_name));
    let data = fetch_api(&path).await?;
    Ok(process_cover_urls(data.get("data").cloned().unwrap_or(data)))
}

#[tauri::command]
pub async fn get_chapter_detail(manga_name: String, chapter_name: String) -> Result<Value, String> {
    let path = format!("/api/manga/{}/{}", encode(&manga_name), encode(&chapter_name));
    let data = fetch_api(&path).await?;
    Ok(process_cover_urls(data.get("data").cloned().unwrap_or(data)))
}

#[tauri::command]
pub fn get_discovered_server() -> Option<String> {
    discovery::get_server_address()
}
