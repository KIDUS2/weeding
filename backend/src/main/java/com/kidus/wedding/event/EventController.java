package com.kidus.wedding.event;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
public class EventController {

    private final WeddingEventRepository repo;

    public EventController(WeddingEventRepository repo) {
        this.repo = repo;
    }

    public record EventView(String brideName, String groomName, LocalDateTime eventDate, String venueName,
                            String venueAddress, String mapUrl, String dressCode, String message) {
        public static EventView of(WeddingEvent e) {
            return new EventView(e.getBrideName(), e.getGroomName(), e.getEventDate(), e.getVenueName(),
                    e.getVenueAddress(), e.getMapUrl(), e.getDressCode(), e.getMessage());
        }
    }

    public record EventUpdate(
            @NotBlank @Size(max = 120) String brideName,
            @NotBlank @Size(max = 120) String groomName,
            LocalDateTime eventDate,
            @Size(max = 200) String venueName,
            @Size(max = 300) String venueAddress,
            @Size(max = 500) String mapUrl,
            @Size(max = 200) String dressCode,
            @Size(max = 2000) String message) {
    }

    @GetMapping("/api/public/event")
    @Transactional(readOnly = true)
    public EventView get() {
        return EventView.of(load());
    }

    @PutMapping("/api/event")
    @Transactional
    public EventView update(@Valid @RequestBody EventUpdate req) {
        WeddingEvent e = load();
        e.setBrideName(req.brideName().trim());
        e.setGroomName(req.groomName().trim());
        e.setEventDate(req.eventDate());
        e.setVenueName(req.venueName());
        e.setVenueAddress(req.venueAddress());
        e.setMapUrl(req.mapUrl());
        e.setDressCode(req.dressCode());
        e.setMessage(req.message());
        e.setUpdatedAt(LocalDateTime.now());
        return EventView.of(e);
    }

    WeddingEvent load() {
        return repo.findById(WeddingEvent.SINGLETON_ID).orElseGet(() -> {
            WeddingEvent e = new WeddingEvent();
            e.setBrideName("Bride");
            e.setGroomName("Groom");
            return repo.save(e);
        });
    }
}
