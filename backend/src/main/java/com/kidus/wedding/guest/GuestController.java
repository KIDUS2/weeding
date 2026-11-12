package com.kidus.wedding.guest;

import com.kidus.wedding.guest.GuestDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class GuestController {

    private final GuestService service;

    public GuestController(GuestService service) {
        this.service = service;
    }

    @GetMapping("/api/guests")
    public List<GuestView> list(@RequestParam(required = false) String q) {
        return service.list(q);
    }

    @GetMapping("/api/guests/{id}")
    public GuestView get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/api/guests")
    @ResponseStatus(HttpStatus.CREATED)
    public GuestView create(@Valid @RequestBody GuestRequest req) {
        return service.create(req);
    }

    @PutMapping("/api/guests/{id}")
    public GuestView update(@PathVariable Long id, @Valid @RequestBody GuestRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/api/guests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/api/guests/{id}/regenerate-code")
    public GuestView regenerate(@PathVariable Long id) {
        return service.regenerateCode(id);
    }

    @PostMapping("/api/guests/{id}/reset-checkin")
    public GuestView resetCheckin(@PathVariable Long id) {
        return service.resetCheckin(id);
    }

    @PostMapping(value = "/api/guests/import", consumes = "multipart/form-data")
    public ImportResult importCsv(@RequestParam("file") MultipartFile file) {
        return service.importCsv(file);
    }

    /** Available to admins and ushers (live counter at the door). */
    @GetMapping("/api/stats")
    public Stats stats() {
        return service.stats();
    }
}
