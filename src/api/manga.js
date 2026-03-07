const API_BASE = ''  // 使用相对路径，让 Vite 代理处理

/**
 * 处理相对路径的 URL，确保以 / 开头
 * 如果已经是完整 URL（http:// 或 https://）则保持不变
 */
function normalizeUrl(url) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 确保以 / 开头
  return url.startsWith('/') ? url : `/${url}`
}

/**
 * 递归处理对象中的 cover_url 字段
 */
function processCoverUrls(obj) {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(item => processCoverUrls(item))
  }

  const result = { ...obj }
  if (result.cover_url) {
    result.cover_url = normalizeUrl(result.cover_url)
  }
  return result
}

// 获取漫画列表
export async function getMangaList() {
  try {
    const response = await fetch(`${API_BASE}/api/manga`)
    if (!response.ok) throw new Error('Failed to fetch manga list')
    const data = await response.json()
    const mangaList = data.data?.manga_list || data.manga_list || []
    return processCoverUrls(mangaList)
  } catch (error) {
    console.error('Error fetching manga list:', error)
    throw error
  }
}

// 获取漫画详情
export async function getMangaInfo(mangaName) {
  try {
    const response = await fetch(`${API_BASE}/api/manga/${encodeURIComponent(mangaName)}`)
    if (!response.ok) throw new Error('Failed to fetch manga info')
    const data = await response.json()
    return processCoverUrls(data.data || data)
  } catch (error) {
    console.error('Error fetching manga info:', error)
    throw error
  }
}

// 获取章节详情（包含页面URL）
export async function getChapterDetail(mangaName, chapterName) {
  try {
    const response = await fetch(`${API_BASE}/manga/${encodeURIComponent(mangaName)}/${encodeURIComponent(chapterName)}`)
    if (!response.ok) throw new Error('Failed to fetch chapter detail')
    const data = await response.json()
    return processCoverUrls(data.data || data)
  } catch (error) {
    console.error('Error fetching chapter detail:', error)
    throw error
  }
}
