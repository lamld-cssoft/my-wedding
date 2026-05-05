import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import CloseIcon from '@mui/icons-material/Close'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import DownloadIcon from '@mui/icons-material/Download'
import './App.css'

const listUrl = import.meta.env.VITE_CLOUDINARY_LIST_URL
const galleryTitle = import.meta.env.VITE_GALLERY_TITLE || 'Wedding Gallery'
const configError = !listUrl ? 'Thiếu VITE_CLOUDINARY_LIST_URL trong file .env.local' : ''

function buildDeliveryUrl(resource, transformation) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !resource.public_id) return resource.secure_url || ''

  const extension = resource.format ? `.${resource.format}` : ''
  const version = resource.version ? `v${resource.version}/` : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${version}${resource.public_id}${extension}`
}

function buildImageUrl(resource) {
  return buildDeliveryUrl(resource, 'f_auto,q_auto,dpr_auto,c_limit,w_1800')
}

function buildGridImageUrl(resource) {
  return buildDeliveryUrl(resource, 'f_auto,q_auto:eco,dpr_auto,c_fill,ar_3:4,g_auto,w_640')
}

function buildDownloadUrl(resource) {
  const cloudDownloadUrl = buildDeliveryUrl(resource, 'fl_attachment')
  return cloudDownloadUrl || buildImageUrl(resource)
}

function App() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(Boolean(listUrl))
  const [error, setError] = useState(configError)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loadedPhotoIds, setLoadedPhotoIds] = useState({})
  const [lightboxImageLoading, setLightboxImageLoading] = useState(true)

  useEffect(() => {
    if (!listUrl) return

    const abortController = new AbortController()

    const fetchPhotos = async () => {
      try {
        const response = await fetch(listUrl, { signal: abortController.signal })
        if (!response.ok) {
          throw new Error(`Cloudinary trả về ${response.status}`)
        }

        const data = await response.json()
        const items = Array.isArray(data.resources) ? data.resources : []
        setPhotos(items)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(
            'Không đọc được danh sách ảnh. Kiểm tra lại URL list và bật "Resource list" trong Cloudinary Settings.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()

    return () => abortController.abort()
  }, [])

  const sortedPhotos = useMemo(
    () =>
      [...photos].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
    [photos]
  )
  const galleryRows = useMemo(() => {
    const rows = []
    let cursor = 0

    while (cursor < sortedPhotos.length) {
      const remaining = sortedPhotos.length - cursor
      let rowSize

      if (remaining <= 3) {
        rowSize = remaining
      } else if (remaining === 4) {
        rowSize = 2
      } else {
        const seed = sortedPhotos[cursor].public_id || sortedPhotos[cursor].asset_id || `${cursor}`
        const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0)
        rowSize = hash % 2 === 0 ? 2 : 3
      }

      const rowItems = sortedPhotos
        .slice(cursor, cursor + rowSize)
        .map((photo, offset) => ({ photo, index: cursor + offset }))

      rows.push(rowItems)
      cursor += rowSize
    }

    return rows
  }, [sortedPhotos])
  const activePhoto = activeIndex >= 0 ? sortedPhotos[activeIndex] : null

  const openAtIndex = (index) => {
    setLightboxImageLoading(true)
    setActiveIndex(index)
  }

  const changeActiveImage = (step) => {
    setLightboxImageLoading(true)
    setActiveIndex((current) => (current + step + sortedPhotos.length) % sortedPhotos.length)
  }

  useEffect(() => {
    if (!activePhoto) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(-1)
      if (event.key === 'ArrowRight') {
        setLightboxImageLoading(true)
        setActiveIndex((current) => (current + 1) % sortedPhotos.length)
      }
      if (event.key === 'ArrowLeft') {
        setLightboxImageLoading(true)
        setActiveIndex((current) => (current - 1 + sortedPhotos.length) % sortedPhotos.length)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePhoto, sortedPhotos.length])

  const showNext = () => changeActiveImage(1)

  const showPrev = () => changeActiveImage(-1)

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">My Wedding</p>
        <h1>{galleryTitle}</h1>
      </header>

      {loading && (
        <div className="loading-wrap">
          <CircularProgress size={30} />
          <p>Đang chuẩn bị album...</p>
        </div>
      )}
      {error && !loading && <p className="state error">{error}</p>}

      {!loading && !error && (
        <section className="grid">
          {galleryRows.map((row, rowIndex) => (
            <div className="gallery-row" style={{ '--cols': row.length }} key={`row-${rowIndex}`}>
              {row.map(({ photo, index }) => {
                const imageUrl = buildGridImageUrl(photo)
                if (!imageUrl) return null
                const photoId = photo.asset_id || photo.public_id
                const isLoaded = Boolean(loadedPhotoIds[photoId])

                return (
                  <article className="card" key={photoId}>
                    <ButtonBase
                      className="photo-trigger"
                      onClick={() => openAtIndex(index)}
                      aria-label="Xem ảnh"
                    >
                      {!isLoaded && <Skeleton variant="rectangular" className="card-skeleton" animation="wave" />}
                      <img
                        src={imageUrl}
                        alt={photo.public_id || 'Wedding photo'}
                        loading="lazy"
                        width={photo.width}
                        height={photo.height}
                        className={isLoaded ? 'photo is-loaded' : 'photo'}
                        onLoad={() => {
                          setLoadedPhotoIds((current) => ({ ...current, [photoId]: true }))
                        }}
                      />
                    </ButtonBase>
                  </article>
                )
              })}
            </div>
          ))}
        </section>
      )}

      {activePhoto && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActiveIndex(-1)}>
          <IconButton
            className="nav-btn prev-btn"
            onClick={(event) => {
              event.stopPropagation()
              showPrev()
            }}
            aria-label="Ảnh trước"
          >
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton
            className="close-btn"
            onClick={(event) => {
              event.stopPropagation()
              setActiveIndex(-1)
            }}
            aria-label="Đóng"
          >
            <CloseIcon />
          </IconButton>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            {lightboxImageLoading && (
              <div className="lightbox-loading">
                <CircularProgress />
              </div>
            )}
            <img
              src={buildImageUrl(activePhoto)}
              alt={activePhoto.public_id || 'Wedding photo'}
              className={lightboxImageLoading ? 'lightbox-image is-hidden' : 'lightbox-image'}
              onLoad={() => setLightboxImageLoading(false)}
            />
            <IconButton
              className="download-btn"
              href={buildDownloadUrl(activePhoto)}
              download
              target="_blank"
              rel="noreferrer"
              component="a"
              aria-label="Tải ảnh"
            >
              <DownloadIcon />
            </IconButton>
          </div>
          <IconButton
            className="nav-btn next-btn"
            onClick={(event) => {
              event.stopPropagation()
              showNext()
            }}
            aria-label="Ảnh tiếp theo"
          >
            <NavigateNextIcon />
          </IconButton>
        </div>
      )}
    </main>
  )
}

export default App
