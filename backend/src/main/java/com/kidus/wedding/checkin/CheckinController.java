package com.kidus.wedding.checkin;

import com.kidus.wedding.checkin.CheckinService.LogView;
import com.kidus.wedding.checkin.CheckinService.ScanResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Door check-in. Scan -> lookup -> usher approves N people. */
@RestController
@RequestMapping("/api/checkin")
public class CheckinController {

    private final CheckinService service;

    public CheckinController(CheckinService service) {
        this.service = service;
    }

    public record LookupRequest(@NotBlank String code) {
    }

    public record ApproveRequest(@NotBlank String code, @Min(1) @Max(50) int people) {
    }

    /** Accepts the raw QR text (URL or code). */
    @PostMapping("/lookup")
    public ScanResult lookup(@Valid @RequestBody LookupRequest req) {
        return service.lookup(req.code());
    }

    @PostMapping("/approve")
    public ScanResult approve(@Valid @RequestBody ApproveRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.approve(req.code(), req.people(), jwt.getSubject());
    }

    @GetMapping("/recent")
    public List<LogView> recent() {
        return service.recent();
    }
}
