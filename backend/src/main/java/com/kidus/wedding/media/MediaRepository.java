package com.kidus.wedding.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<Media, Long> {

    List<Media> findByKindOrderBySortOrderAscIdAsc(Media.Kind kind);

    Optional<Media> findFirstByKind(Media.Kind kind);

    Optional<Media> findByStoredName(String storedName);

    @Query("select coalesce(max(m.sortOrder), 0) from Media m where m.kind = :kind")
    int maxSortOrder(@Param("kind") Media.Kind kind);

    @Modifying
    @Query("update Media m set m.cover = false where m.cover = true")
    void clearCover();
}
