mod api;
mod discovery;



// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // 应用启动时启动 UDP 自发现服务
            let app_handle = app.handle().clone();
            discovery::spawn_discovery_task(app_handle);
            Ok(())
        })
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
