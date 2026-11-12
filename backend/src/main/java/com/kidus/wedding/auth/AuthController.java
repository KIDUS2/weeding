package com.kidus.wedding.auth;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.config.AppProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final AppProperties props;

    public AuthController(AppUserRepository users, PasswordEncoder passwordEncoder,
                          JwtEncoder jwtEncoder, AppProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.props = props;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record UserView(Long id, String username, String displayName, Role role, boolean active) {
        static UserView of(AppUser u) {
            return new UserView(u.getId(), u.getUsername(), u.getDisplayName(), u.getRole(), u.isActive());
        }
    }

    public record LoginResponse(String token, Instant expiresAt, UserView user) {
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        AppUser user = users.findByUsernameIgnoreCase(req.username().trim())
                .filter(AppUser::isActive)
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofHours(props.jwt().ttlHours()));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("wedding-app")
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(exp)
                .claim("roles", List.of(user.getRole().name()))
                .claim("name", user.getDisplayName())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new LoginResponse(token, exp, UserView.of(user));
    }

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal Jwt jwt) {
        return users.findByUsernameIgnoreCase(jwt.getSubject())
                .filter(AppUser::isActive)
                .map(UserView::of)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer active"));
    }
}
