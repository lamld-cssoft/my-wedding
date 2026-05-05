import { useEffect, useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
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
  if (!cloudName || !resource.public_id) return ''

  const extension = resource.format ? `.${resource.format}` : ''
  const version = resource.version ? `v${resource.version}/` : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${version}${resource.public_id}${extension}`
}

function buildImageUrl(resource) {
  if (resource.secure_url) return resource.secure_url
  return buildDeliveryUrl(resource, 'f_auto,q_auto')
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
  const activePhoto = activeIndex >= 0 ? sortedPhotos[activeIndex] : null

  useEffect(() => {
    if (!activePhoto) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(-1)
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => (current + 1) % sortedPhotos.length)
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => (current - 1 + sortedPhotos.length) % sortedPhotos.length)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePhoto, sortedPhotos.length])

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % sortedPhotos.length)
  }

  const showPrev = () => {
    setActiveIndex((current) => (current - 1 + sortedPhotos.length) % sortedPhotos.length)
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Cloudinary Photo Gallery</p>
        <h1>{galleryTitle}</h1>
      </header>

      {loading && <p className="state">Đang tải ảnh...</p>}
      {error && !loading && <p className="state error">{error}</p>}

      {!loading && !error && (
        <section className="grid">
          {sortedPhotos.map((photo, index) => {
            const imageUrl = buildImageUrl(photo)
            if (!imageUrl) return null

            return (
              <article className="card" key={photo.asset_id || photo.public_id}>
                <ButtonBase
                  className="photo-trigger"
                  onClick={() => setActiveIndex(index)}
                  aria-label="Xem ảnh"
                >
                  <img
                    src={imageUrl}
                    alt={photo.public_id || 'Wedding photo'}
                    loading="lazy"
                    width={photo.width}
                    height={photo.height}
                  />
                </ButtonBase>
              </article>
            )
          })}
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
            <img src={buildImageUrl(activePhoto)} alt={activePhoto.public_id || 'Wedding photo'} />
            <Button
              className="download-btn"
              variant="contained"
              startIcon={<DownloadIcon />}
              href={buildDownloadUrl(activePhoto)}
              download
              target="_blank"
              rel="noreferrer"
              component="a"
            >
              Download
            </Button>
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
