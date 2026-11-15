package com.kidus.wedding.site;

import com.kidus.wedding.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** Wedding website sections: schedule of events, our story, questions & answers. */
@RestController
public class SiteController {

    static final int MAX_PER_KIND = 40;

    private final SiteItemRepository repo;

    public SiteController(SiteItemRepository repo) {
        this.repo = repo;
    }

    public record SiteItemView(Long id, SiteItem.Kind kind, String title, String titleAm, String body, String bodyAm,
                               String label, LocalDateTime startsAt, LocalDateTime endsAt, String venueName,
                               String venueAddress, String mapUrl, int sortOrder) {
        static SiteItemView of(SiteItem s) {
            return new SiteItemView(s.getId(), s.getKind(), s.getTitle(), s.getTitleAm(), s.getBody(), s.getBodyAm(),
                    s.getLabel(), s.getStartsAt(), s.getEndsAt(), s.getVenueName(), s.getVenueAddress(),
                    s.getMapUrl(), s.getSortOrder());
        }
    }

    public record SiteItemRequest(
            @NotNull SiteItem.Kind kind,
            @NotBlank @Size(max = 200) String title,
            @Size(max = 200) String titleAm,
            @Size(max = 4000) String body,
            @Size(max = 4000) String bodyAm,
            @Size(max = 60) String label,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            @Size(max = 200) String venueName,
            @Size(max = 300) String venueAddress,
            @Size(max = 500) String mapUrl) {
    }

    public record ReorderRequest(@NotNull SiteItem.Kind kind, @NotEmpty List<Long> ids) {
    }

    public record PublicSite(List<SiteItemView> events, List<SiteItemView> story, List<SiteItemView> faq) {
    }

    @GetMapping("/api/public/site")
    @Transactional(readOnly = true)
    public PublicSite publicSite() {
        return new PublicSite(
                repo.findByKindOrderByStartsAtAscIdAsc(SiteItem.Kind.EVENT).stream().map(SiteItemView::of).toList(),
                repo.findByKindOrderBySortOrderAscIdAsc(SiteItem.Kind.STORY).stream().map(SiteItemView::of).toList(),
                repo.findByKindOrderBySortOrderAscIdAsc(SiteItem.Kind.FAQ).stream().map(SiteItemView::of).toList());
    }

    @GetMapping("/api/site-items")
    @Transactional(readOnly = true)
    public List<SiteItemView> list(@RequestParam SiteItem.Kind kind) {
        List<SiteItem> items = kind == SiteItem.Kind.EVENT
                ? repo.findByKindOrderByStartsAtAscIdAsc(kind)
                : repo.findByKindOrderBySortOrderAscIdAsc(kind);
        return items.stream().map(SiteItemView::of).toList();
    }

    @PostMapping("/api/site-items")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SiteItemView create(@Valid @RequestBody SiteItemRequest req) {
        if (repo.countByKind(req.kind()) >= MAX_PER_KIND) {
            throw ApiException.badRequest("You can add up to " + MAX_PER_KIND + " items here");
        }
        SiteItem s = new SiteItem();
        s.setKind(req.kind());
        apply(s, req);
        s.setSortOrder(repo.maxSortOrder(req.kind()) + 1);
        return SiteItemView.of(repo.save(s));
    }

    @PutMapping("/api/site-items/{id}")
    @Transactional
    public SiteItemView update(@PathVariable Long id, @Valid @RequestBody SiteItemRequest req) {
        SiteItem s = find(id);
        if (s.getKind() != req.kind()) throw ApiException.badRequest("Item type cannot be changed");
        apply(s, req);
        return SiteItemView.of(s);
    }

    @PutMapping("/api/site-items/order")
    @Transactional
    public List<SiteItemView> reorder(@Valid @RequestBody ReorderRequest req) {
        for (int i = 0; i < req.ids().size(); i++) {
            SiteItem s = find(req.ids().get(i));
            if (s.getKind() != req.kind()) throw ApiException.badRequest("Mixed item types in reorder");
            s.setSortOrder(i + 1);
        }
        return list(req.kind());
    }

    @DeleteMapping("/api/site-items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        repo.delete(find(id));
    }

    private void apply(SiteItem s, SiteItemRequest req) {
        s.setTitle(req.title().trim());
        s.setTitleAm(clean(req.titleAm()));
        s.setBody(clean(req.body()));
        s.setBodyAm(clean(req.bodyAm()));
        if (req.kind() == SiteItem.Kind.EVENT) {
            if (req.startsAt() == null) throw ApiException.badRequest("Choose when this event starts");
            if (req.endsAt() != null && req.endsAt().isBefore(req.startsAt())) {
                throw ApiException.badRequest("The end time must be after the start time");
            }
            s.setStartsAt(req.startsAt());
            s.setEndsAt(req.endsAt());
            s.setVenueName(clean(req.venueName()));
            s.setVenueAddress(clean(req.venueAddress()));
            s.setMapUrl(cleanUrl(req.mapUrl()));
            s.setLabel(null);
        } else {
            s.setLabel(req.kind() == SiteItem.Kind.STORY ? clean(req.label()) : null);
            s.setStartsAt(null);
            s.setEndsAt(null);
            s.setVenueName(null);
            s.setVenueAddress(null);
            s.setMapUrl(null);
        }
    }

    private SiteItem find(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Item not found"));
    }

    private static String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** Only http(s) links, so a "javascript:" URL can't end up on the guest page. */
    private static String cleanUrl(String s) {
        String v = clean(s);
        if (v == null) return null;
        String lower = v.toLowerCase();
        if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
            throw ApiException.badRequest("Map link must start with https://");
        }
        return v;
    }
}
