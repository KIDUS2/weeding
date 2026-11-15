package com.kidus.wedding.media;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);
    static final long MAX_PHOTO = 10L * 1024 * 1024;
    static final long MAX_MUSIC = 20L * 1024 * 1024;
    static final int MAX_PHOTOS = 60;

    private final MediaRepository repo;
    private final Path root;

    public MediaService(MediaRepository repo, AppProperties props) throws IOException {
        this.repo = repo;
        String dir = props.storage() == null || props.storage().dir() == null ? "./data/uploads" : props.storage().dir();
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        log.info("Media stored in {}", root);
    }

    public record MediaView(Long id, Media.Kind kind, String url, String caption, int sortOrder,
                            boolean cover, String originalName, long sizeBytes) {
        static MediaView of(Media m) {
            return new MediaView(m.getId(), m.getKind(), "/api/public/media/" + m.getStoredName(),
                    m.getCaption(), m.getSortOrder(), m.isCover(), m.getOriginalName(), m.getSizeBytes());
        }
    }

    /** What the invitation page needs in one call. */
    public record PublicMedia(MediaView cover, List<MediaView> photos, MediaView music) {
    }

    @Transactional(readOnly = true)
    public List<MediaView> listAll() {
        List<Media> photos = repo.findByKindOrderBySortOrderAscIdAsc(Media.Kind.PHOTO);
        List<Media> music = repo.findByKindOrderBySortOrderAscIdAsc(Media.Kind.MUSIC);
        return java.util.stream.Stream.concat(photos.stream(), music.stream()).map(MediaView::of).toList();
    }

    @Transactional(readOnly = true)
    public PublicMedia publicMedia() {
        List<MediaView> photos = repo.findByKindOrderBySortOrderAscIdAsc(Media.Kind.PHOTO).stream().map(MediaView::of).toList();
        MediaView cover = photos.stream().filter(MediaView::cover).findFirst().orElse(photos.isEmpty() ? null : photos.get(0));
        MediaView music = repo.findFirstByKind(Media.Kind.MUSIC).map(MediaView::of).orElse(null);
        return new PublicMedia(cover, photos, music);
    }

    @Transactional
    public MediaView upload(MultipartFile file, String caption) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Choose a file to upload");
        byte[] head = new byte[16];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the file");
        }
        FileSniffer.Type type = FileSniffer.detect(java.util.Arrays.copyOf(head, read))
                .orElseThrow(() -> ApiException.badRequest("Only JPG, PNG or WebP photos and MP3, M4A or OGG music are allowed"));

        long limit = type.kind() == Media.Kind.PHOTO ? MAX_PHOTO : MAX_MUSIC;
        if (file.getSize() > limit) {
            throw ApiException.badRequest("File is too large (max " + (limit / 1024 / 1024) + " MB)");
        }
        if (type.kind() == Media.Kind.PHOTO
                && repo.findByKindOrderBySortOrderAscIdAsc(Media.Kind.PHOTO).size() >= MAX_PHOTOS) {
            throw ApiException.badRequest("You can upload up to " + MAX_PHOTOS + " photos");
        }

        String stored = UUID.randomUUID().toString().replace("-", "") + "." + type.extension();
        Path target = resolve(stored);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Could not save upload", e);
        }
        deleteFileOnRollback(target);

        // Only one background song: replace the previous one.
        if (type.kind() == Media.Kind.MUSIC) {
            repo.findByKindOrderBySortOrderAscIdAsc(Media.Kind.MUSIC).forEach(this::remove);
        }

        Media m = new Media();
        m.setKind(type.kind());
        m.setStoredName(stored);
        m.setOriginalName(truncate(file.getOriginalFilename(), 255));
        m.setContentType(type.contentType());
        m.setSizeBytes(file.getSize());
        m.setCaption(blankToNull(truncate(caption, 300)));
        m.setSortOrder(repo.maxSortOrder(type.kind()) + 1);
        return MediaView.of(repo.save(m));
    }

    @Transactional
    public MediaView update(Long id, String caption, Boolean cover) {
        Media m = find(id);
        if (caption != null) m.setCaption(blankToNull(truncate(caption, 300)));
        if (Boolean.TRUE.equals(cover)) {
            if (m.getKind() != Media.Kind.PHOTO) throw ApiException.badRequest("Only a photo can be the cover");
            repo.clearCover();
            repo.flush();
            m.setCover(true);
        } else if (Boolean.FALSE.equals(cover)) {
            m.setCover(false);
        }
        return MediaView.of(m);
    }

    /** Saves a new photo order (ids in the desired order). */
    @Transactional
    public List<MediaView> reorder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Media m = find(ids.get(i));
            m.setSortOrder(i + 1);
        }
        return listAll();
    }

    @Transactional
    public void delete(Long id) {
        remove(find(id));
    }

    @Transactional(readOnly = true)
    public Stored load(String storedName) {
        Media m = repo.findByStoredName(storedName).orElseThrow(() -> ApiException.notFound("File not found"));
        Path p = resolve(m.getStoredName());
        if (!Files.exists(p)) throw ApiException.notFound("File not found");
        return new Stored(p, m.getContentType());
    }

    public record Stored(Path path, String contentType) {
    }

    private void remove(Media m) {
        Path p = resolve(m.getStoredName());
        repo.delete(m);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException e) {
                    log.warn("Could not delete {}", p, e);
                }
            }
        });
    }

    private void deleteFileOnRollback(Path p) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                        // best effort
                    }
                }
            }
        });
    }

    private Path resolve(String storedName) {
        Path p = root.resolve(storedName).normalize();
        if (!p.startsWith(root)) throw ApiException.badRequest("Invalid file name");
        return p;
    }

    private Media find(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Media not found"));
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
