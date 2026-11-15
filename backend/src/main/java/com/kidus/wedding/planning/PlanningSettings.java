package com.kidus.wedding.planning;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "planning_settings")
public class PlanningSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(name = "total_budget", precision = 14, scale = 2)
    private BigDecimal totalBudget;

    public Long getId() { return id; }
    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }
}
