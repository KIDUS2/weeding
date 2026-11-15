package com.kidus.wedding.planning;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetItemRepository extends JpaRepository<BudgetItem, Long> {

    List<BudgetItem> findAllByOrderByCategoryAscIdAsc();
}
