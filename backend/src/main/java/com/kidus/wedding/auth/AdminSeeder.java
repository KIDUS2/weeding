package com.kidus.wedding.auth;

import com.kidus.wedding.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the first admin account on an empty database. */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    public AdminSeeder(AppUserRepository users, PasswordEncoder passwordEncoder, AppProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) return;
        AppUser admin = new AppUser();
        admin.setUsername(props.admin().username().trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(props.admin().password()));
        admin.setDisplayName("Administrator");
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.warn("Created initial admin '{}'. Change the password after first login!", admin.getUsername());
    }
}
