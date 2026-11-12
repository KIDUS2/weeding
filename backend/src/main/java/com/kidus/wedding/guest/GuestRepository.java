package com.kidus.wedding.guest;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByInviteCode(String inviteCode);

    /** Row lock so two doors scanning the same invitation can't over-admit. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from Guest g where g.inviteCode = :code")
    Optional<Guest> findByInviteCodeForUpdate(@Param("code") String code);

    boolean existsByInviteCode(String inviteCode);

    List<Guest> findAllByOrderByFullNameAsc();
}
