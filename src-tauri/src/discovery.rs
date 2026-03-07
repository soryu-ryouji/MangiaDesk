use std::net::SocketAddr;
use std::sync::{Arc, RwLock};
use tokio::net::UdpSocket;
use tokio::time::{interval, Duration};

/// 服务器地址状态（线程安全）
pub static SERVER_ADDRESS: once_cell::sync::Lazy<Arc<RwLock<String>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(String::new())));

const DISCOVERY_PORT: u16 = 5001;
const DISCOVERY_PREFIX: &str = "MangiaServer|";
const DISCOVERY_INTERVAL_SECS: u64 = 10;
const SERVER_TIMEOUT_SECS: u64 = 30;

/// 获取当前发现的服务器地址
pub fn get_server_address() -> Option<String> {
    let addr = SERVER_ADDRESS.read().ok()?;
    if addr.is_empty() {
        None
    } else {
        Some(addr.clone())
    }
}

/// 设置服务器地址
fn set_server_address(address: &str) {
    if let Ok(mut addr) = SERVER_ADDRESS.write() {
        if *addr != address {
            log::info!("发现漫画服务器: {}", address);
            *addr = address.to_string();
        }
    }
}

/// 清空服务器地址（超时使用）
fn clear_server_address() {
    if let Ok(mut addr) = SERVER_ADDRESS.write() {
        if !addr.is_empty() {
            log::warn!("漫画服务器已超时，清空地址");
            addr.clear();
        }
    }
}

/// 解析 UDP 报文，格式: MangiaServer|address:port
fn parse_discovery_packet(data: &[u8]) -> Option<String> {
    let msg = std::str::from_utf8(data).ok()?;
    let msg = msg.trim();

    if let Some(addr_part) = msg.strip_prefix(DISCOVERY_PREFIX) {
        // 简单验证地址格式
        if addr_part.contains(':') {
            return Some(addr_part.to_string());
        }
    }
    None
}

/// 启动 UDP 自发现服务
pub async fn start_discovery_service() -> tokio::io::Result<()> {
    // 绑定到 5001 端口接收广播
    let bind_addr = SocketAddr::from(([0, 0, 0, 0], DISCOVERY_PORT));
    let socket = match UdpSocket::bind(bind_addr).await {
        Ok(s) => {
            log::info!("UDP 自发现服务已启动，监听端口 {}", DISCOVERY_PORT);
            s
        }
        Err(e) => {
            log::error!("无法绑定 UDP 端口 {}: {}", DISCOVERY_PORT, e);
            return Err(e);
        }
    };

    let mut buf = vec![0u8; 1024];
    let mut check_interval = interval(Duration::from_secs(DISCOVERY_INTERVAL_SECS));
    let mut last_received = std::time::Instant::now();

    loop {
        tokio::select! {
            result = socket.recv_from(&mut buf) => {
                match result {
                    Ok((len, _src)) => {
                        if let Some(address) = parse_discovery_packet(&buf[..len]) {
                            let full_url = format!("http://{}", address);
                            set_server_address(&full_url);
                            last_received = std::time::Instant::now();
                        }
                    }
                    Err(e) => {
                        log::warn!("UDP 接收错误: {}", e);
                    }
                }
            }
            _ = check_interval.tick() => {
                if last_received.elapsed().as_secs() > SERVER_TIMEOUT_SECS {
                    clear_server_address();
                }
            }
        }
    }
}

/// 启动发现服务（后台任务）
/// 注意：必须在 Tauri runtime 上启动，避免 "there is no reactor running"
pub fn spawn_discovery_task() {
    tauri::async_runtime::spawn(async {
        if let Err(e) = start_discovery_service().await {
            log::error!("UDP 自发现服务异常: {}", e);
        }
    });
}
