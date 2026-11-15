package com.kidus.wedding.planning;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budget_item")
public class BudgetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category = Category.OTHER;

    @Column(nullable = false)
    private String name;

    @Column(name = "vendor_name")
    private String vendorName;

    @Column(name = "vendor_phone")
    private String vendorPhone;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal estimated = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal actual;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal paid = BigDecimal.ZERO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** What this line will really cost: the agreed price once known, otherwise the estimate. */
    public BigDecimal expected() {
        return actual != null ? actual : estimated;
    }

    public Long getId() { return id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getVendorPhone() { return vendorPhone; }
    public void setVendorPhone(String vendorPhone) { this.vendorPhone = vendorPhone; }
    public BigDecimal getEstimated() { return estimated; }
    public void setEstimated(BigDecimal estimated) { this.estimated = estimated; }
    public BigDecimal getActual() { return actual; }
    public void setActual(BigDecimal actual) { this.actual = actual; }
    public BigDecimal getPaid() { return paid; }
    public void setPaid(BigDecimal paid) { this.paid = paid; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
