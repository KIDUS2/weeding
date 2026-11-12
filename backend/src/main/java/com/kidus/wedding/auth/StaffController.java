package com.kidus.wedding.auth;

import com.kidus.wedding.auth.AuthController.UserView;
import com.kidus.wedding.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin manages door staff (ushers) and other admins. */
@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public StaffController(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public record CreateStaffRequest(
            @NotBlank @Size(min = 3, max = 60) String username,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank @Size(max = 120) String displayName,
            @NotNull Role role) {
    }

    public record UpdateStaffRequest(
            @Size(max = 120) String displayName,
            Role role,
            Boolean active,
            @Size(min = 6, max = 100) String password) {
    }

    @GetMapping
    public List<UserView> list() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(UserView::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserView create(@Valid @RequestBody CreateStaffRequest req) {
        String username = req.username().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username)) {
            throw ApiException.conflict("Username already taken");
        }
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setDisplayName(req.displayName().trim());
        u.setRole(req.role());
        return UserView.of(users.save(u));
    }

    @PutMapping("/{id}")
    @Transactional
    public UserView update(@PathVariable Long id, @Valid @RequestBody UpdateStaffRequest req,
                           @AuthenticationPrincipal Jwt jwt) {
        AppUser u = users.findById(id).orElseThrow(() -> ApiException.notFound("Staff member not found"));
        boolean self = u.getUsername().equalsIgnoreCase(jwt.getSubject());

        if (req.displayName() != null && !req.displayName().isBlank()) u.setDisplayName(req.displayName().trim());
        if (req.password() != null && !req.password().isBlank()) u.setPasswordHash(passwordEncoder.encode(req.password()));
        if (req.role() != null && req.role() != u.getRole()) {
            if (self) throw ApiException.badRequest("You cannot change your own role");
            u.setRole(req.role());
        }
        if (req.active() != null && req.active() != u.isActive()) {
            if (self) throw ApiException.badRequest("You cannot deactivate yourself");
            u.setActive(req.active());
        }
        if (users.countByRoleAndActiveTrue(Role.ADMIN) == 0) {
            throw ApiException.badRequest("At least one active admin is required");
        }
        return UserView.of(u);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        AppUser u = users.findById(id).orElseThrow(() -> ApiException.notFound("Staff member not found"));
        if (u.getUsername().equalsIgnoreCase(jwt.getSubject())) {
            throw ApiException.badRequest("You cannot delete yourself");
        }
        users.delete(u);
    }
}
