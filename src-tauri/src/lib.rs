mod api;
mod discovery;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    discovery::spawn_discovery_task();

    tauri::Builder::default()
        .setup(|_app| {
            discovery::spawn_discovery_task(); // 启动 UDP 发现
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            api::get_manga_list,
            api::get_manga_info,
            api::get_chapter_detail,
            api::get_discovered_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
