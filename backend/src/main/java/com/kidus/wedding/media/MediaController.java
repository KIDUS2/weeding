package com.kidus.wedding.media;

import com.kidus.wedding.media.MediaService.MediaView;
import com.kidus.wedding.media.MediaService.PublicMedia;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
public class MediaController {

    private final MediaService service;

    public MediaController(MediaService service) {
        this.service = service;
    }

    public record MediaUpdate(@Size(max = 300) String caption, Boolean cover) {
    }

    public record ReorderRequest(@NotEmpty List<Long> ids) {
    }

    // ---- admin ----

    @GetMapping("/api/media")
    public List<MediaView> list() {
        return service.listAll();
    }

    @PostMapping(value = "/api/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MediaView upload(@RequestParam("file") MultipartFile file,
                            @RequestParam(value = "caption", required = false) String caption) {
        return service.upload(file, caption);
    }

    @PutMapping("/api/media/{id}")
    public MediaView update(@PathVariable Long id, @Valid @RequestBody MediaUpdate req) {
        return service.update(id, req.caption(), req.cover());
    }

    @PutMapping("/api/media/order")
    public List<MediaView> reorder(@Valid @RequestBody ReorderRequest req) {
        return service.reorder(req.ids());
    }

    @DeleteMapping("/api/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // ---- public (invitation page) ----

    @GetMapping("/api/public/media")
    public PublicMedia publicMedia() {
        return service.publicMedia();
    }

    /** File names are random UUIDs, so files can be cached for a long time. */
    @GetMapping("/api/public/media/{name:[a-f0-9]{32}\\.[a-z0-9]{3,4}}")
    public ResponseEntity<FileSystemResource> file(@PathVariable String name) {
        MediaService.Stored s = service.load(name);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(s.contentType()))
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(s.path()));
    }
}
