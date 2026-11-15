package com.kidus.wedding.site;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SiteItemRepository extends JpaRepository<SiteItem, Long> {

    List<SiteItem> findByKindOrderBySortOrderAscIdAsc(SiteItem.Kind kind);

    /** The schedule is always shown in time order. */
    List<SiteItem> findByKindOrderByStartsAtAscIdAsc(SiteItem.Kind kind);

    @Query("select coalesce(max(s.sortOrder), 0) from SiteItem s where s.kind = :kind")
    int maxSortOrder(@Param("kind") SiteItem.Kind kind);

    long countByKind(SiteItem.Kind kind);
}
