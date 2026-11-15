import { useEffect, useRef, useState, type DragEvent } from 'react';
import { api, mediaSrc, type MediaItem } from '../../api';
import { shrinkImage } from '../../components/shrinkImage';

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function Media() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);

  const load = () => api.media().then(setItems);
  useEffect(() => { load(); }, []);

  const photos = items.filter((m) => m.kind === 'PHOTO');
  const music = items.find((m) => m.kind === 'MUSIC');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const uploadPhotos = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/') || /\.(heic|jpe?g|png|webp)$/i.test(f.name));
    if (!list.length) return;
    setErrors([]);
    setProgress({ done: 0, total: list.length });
    const failed: string[] = [];
    for (let i = 0; i < list.length; i++) {
      try {
        const { blob, name } = await shrinkImage(list[i]);
        await api.uploadMedia(blob, name);
      } catch (e) {
        failed.push(`${list[i].name}: ${(e as Error).message}`);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    setErrors(failed);
    if (photoInput.current) photoInput.current.value = '';
    await load();
    if (list.length > failed.length) flash(`Added ${list.length - failed.length} photo(s)`);
  };

  const uploadMusic = async (file: File | undefined) => {
    if (!file) return;
    setErrors([]);
    setProgress({ done: 0, total: 1 });
    try {
      await api.uploadMedia(file, file.name);
      flash('Music saved');
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setProgress(null);
      if (musicInput.current) musicInput.current.value = '';
      load();
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...photos];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems([...next, ...items.filter((m) => m.kind !== 'PHOTO')]);
    await api.reorderMedia(next.map((p) => p.id));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void uploadPhotos(e.dataTransfer.files);
  };

  return (
    <div className="media-page">
      <section className="panel wide">
        <div className="panel-head">
          <div>
            <h1 className="title-sm">Photos</h1>
            <p className="muted">They appear as a gallery on every invitation. The cover photo opens the invitation.</p>
          </div>
          <span className="muted small">{photos.length} / 60</span>
        </div>

        <label
          className={`dropzone ${dragging ? 'is-over' : ''} ${progress ? 'is-busy' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden
                 onChange={(e) => uploadPhotos(e.target.files)} disabled={!!progress} />
          {progress
            ? <>
                <strong>Uploading {progress.done} of {progress.total}…</strong>
                <span className="bar" aria-hidden><span style={{ width: `${(progress.done / progress.total) * 100}%` }} /></span>
              </>
            : <>
                <strong>Drop photos here or choose files</strong>
                <span className="muted small">JPG, PNG or WebP. Large photos are resized automatically.</span>
              </>}
        </label>

        {errors.length > 0 && (
          <ul className="error-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}

        {photos.length === 0 ? (
          <p className="empty-note">No photos yet. Add engagement or pre-wedding photos to make the invitation personal.</p>
        ) : (
          <ul className="photo-grid">
            {photos.map((p, i) => (
              <li key={p.id} className={p.cover ? 'is-cover' : ''}>
                <div className="photo-thumb">
                  <img src={mediaSrc(p.url)} alt={p.caption ?? `Photo ${i + 1}`} loading="lazy" />
                  {p.cover && <span className="cover-badge">Cover</span>}
                </div>
                <input
                  className="caption-input"
                  defaultValue={p.caption ?? ''}
                  placeholder="Add a caption"
                  maxLength={300}
                  aria-label={`Caption for photo ${i + 1}`}
                  onBlur={async (e) => {
                    if (e.target.value !== (p.caption ?? '')) {
                      await api.updateMedia(p.id, { caption: e.target.value });
                      flash('Caption saved');
                      load();
                    }
                  }}
                />
                <div className="photo-tools">
                  <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">←</button>
                  <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Move later">→</button>
                  {!p.cover && (
                    <button className="btn btn-small btn-ghost" onClick={async () => { await api.updateMedia(p.id, { cover: true }); load(); flash('Cover photo set'); }}>
                      Make cover
                    </button>
                  )}
                  <button className="btn btn-small btn-danger" onClick={async () => {
                    if (!confirm('Delete this photo?')) return;
                    await api.deleteMedia(p.id); load(); flash('Photo deleted');
                  }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel wide">
        <h2 className="title-sm">Background music</h2>
        <p className="muted">Plays softly when a guest opens the envelope. Guests can mute it at any time.</p>
        {music ? (
          <div className="music-row">
            <div>
              <strong>{music.originalName ?? 'Song'}</strong>
              <span className="muted small">{mb(music.sizeBytes)}</span>
            </div>
            <audio controls preload="none" src={mediaSrc(music.url)} />
            <div className="row-gap">
              <button className="btn btn-small btn-ghost" onClick={() => musicInput.current?.click()} disabled={!!progress}>Replace</button>
              <button className="btn btn-small btn-danger" onClick={async () => {
                if (!confirm('Remove the background music?')) return;
                await api.deleteMedia(music.id); load(); flash('Music removed');
              }}>Remove</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ink" onClick={() => musicInput.current?.click()} disabled={!!progress}>
            {progress ? 'Uploading…' : 'Choose a song'}
          </button>
        )}
        <input ref={musicInput} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,.mp3,.m4a,.ogg" hidden
               onChange={(e) => uploadMusic(e.target.files?.[0])} />
        <p className="muted small">MP3, M4A or OGG, up to 20 MB. Use music you have the right to share.</p>
      </section>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
