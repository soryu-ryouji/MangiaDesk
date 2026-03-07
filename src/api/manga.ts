import { invoke } from '@tauri-apps/api/core'

export function getMangaList() {
  return invoke('get_manga_list')
}

export function getMangaInfo(mangaName: string) {
  return invoke('get_manga_info', { mangaName })
}

export function getChapterDetail(mangaName: string, chapterName: string) {
  return invoke('get_chapter_detail', { mangaName, chapterName })
}
