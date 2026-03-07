import { invoke } from '@tauri-apps/api/core'

export function get_discovered_server() {
  return invoke('get_discovered_server')
}
