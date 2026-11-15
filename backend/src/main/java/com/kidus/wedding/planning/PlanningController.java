package com.kidus.wedding.planning;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.event.WeddingEvent;
import com.kidus.wedding.event.WeddingEventRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Private planning tools: checklist and budget. Admin only (covered by the /api/** rule). */
@RestController
@RequestMapping("/api/planning")
public class PlanningController {

    private final PlanningTaskRepository tasks;
    private final BudgetItemRepository budget;
    private final PlanningSettingsRepository settings;
    private final WeddingEventRepository events;

    public PlanningController(PlanningTaskRepository tasks, BudgetItemRepository budget,
                              PlanningSettingsRepository settings, WeddingEventRepository events) {
        this.tasks = tasks;
        this.budget = budget;
        this.settings = settings;
        this.events = events;
    }

    // ---------- DTOs ----------

    public record TaskView(Long id, String title, Category category, LocalDate dueDate, boolean done,
                           LocalDateTime doneAt, String assignee, String notes) {
        static TaskView of(PlanningTask t) {
            return new TaskView(t.getId(), t.getTitle(), t.getCategory(), t.getDueDate(), t.isDone(),
                    t.getDoneAt(), t.getAssignee(), t.getNotes());
        }
    }

    public record TaskRequest(@NotBlank @Size(max = 200) String title, Category category, LocalDate dueDate,
                              Boolean done, @Size(max = 80) String assignee, @Size(max = 1000) String notes) {
    }

    public record BudgetView(Long id, Category category, String name, String vendorName, String vendorPhone,
                             BigDecimal estimated, BigDecimal actual, BigDecimal paid, LocalDate dueDate, String notes) {
        static BudgetView of(BudgetItem b) {
            return new BudgetView(b.getId(), b.getCategory(), b.getName(), b.getVendorName(), b.getVendorPhone(),
                    b.getEstimated(), b.getActual(), b.getPaid(), b.getDueDate(), b.getNotes());
        }
    }

    public record BudgetRequest(@NotBlank @Size(max = 200) String name, Category category,
                                @Size(max = 160) String vendorName, @Size(max = 40) String vendorPhone,
                                @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal estimated,
                                @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal actual,
                                @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal paid,
                                LocalDate dueDate, @Size(max = 1000) String notes) {
    }

    public record SettingsRequest(@DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal totalBudget) {
    }

    public record CategoryTotal(Category category, BigDecimal expected, BigDecimal paid) {
    }

    public record Summary(BigDecimal totalBudget, BigDecimal estimated, BigDecimal expected, BigDecimal paid,
                          BigDecimal stillToPay, BigDecimal left, List<CategoryTotal> byCategory,
                          int tasksTotal, int tasksDone, int tasksOverdue, List<TaskView> nextTasks,
                          List<BudgetView> paymentsDue, LocalDate weddingDate, Long daysToGo) {
    }

    // ---------- checklist ----------

    @GetMapping("/tasks")
    @Transactional(readOnly = true)
    public List<TaskView> listTasks() {
        return tasks.findAllOrdered().stream().map(TaskView::of).toList();
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public TaskView createTask(@Valid @RequestBody TaskRequest req) {
        if (tasks.count() >= 500) throw ApiException.badRequest("The checklist is full (500 tasks)");
        PlanningTask t = new PlanningTask();
        applyTask(t, req);
        return TaskView.of(tasks.save(t));
    }

    @PutMapping("/tasks/{id}")
    @Transactional
    public TaskView updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest req) {
        PlanningTask t = findTask(id);
        applyTask(t, req);
        return TaskView.of(t);
    }

    @PatchMapping("/tasks/{id}/done")
    @Transactional
    public TaskView setDone(@PathVariable Long id, @RequestParam boolean value) {
        PlanningTask t = findTask(id);
        markDone(t, value);
        return TaskView.of(t);
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteTask(@PathVariable Long id) {
        tasks.delete(findTask(id));
    }

    /** Adds the starter checklist, with due dates counted back from the wedding date. */
    @PostMapping("/tasks/starter")
    @Transactional
    public List<TaskView> addStarter() {
        if (tasks.count() > 0) throw ApiException.conflict("The checklist already has tasks");
        LocalDate wedding = weddingDate();
        for (StarterChecklist.Item item : StarterChecklist.ITEMS) {
            PlanningTask t = new PlanningTask();
            t.setTitle(item.title());
            t.setCategory(item.category());
            t.setDueDate(wedding == null ? null : wedding.minusDays(item.daysBefore()));
            tasks.save(t);
        }
        return listTasks();
    }

    // ---------- budget ----------

    @GetMapping("/budget")
    @Transactional(readOnly = true)
    public List<BudgetView> listBudget() {
        return budget.findAllByOrderByCategoryAscIdAsc().stream().map(BudgetView::of).toList();
    }

    @PostMapping("/budget")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public BudgetView createBudget(@Valid @RequestBody BudgetRequest req) {
        if (budget.count() >= 300) throw ApiException.badRequest("The budget is full (300 lines)");
        BudgetItem b = new BudgetItem();
        applyBudget(b, req);
        return BudgetView.of(budget.save(b));
    }

    @PutMapping("/budget/{id}")
    @Transactional
    public BudgetView updateBudget(@PathVariable Long id, @Valid @RequestBody BudgetRequest req) {
        BudgetItem b = findBudget(id);
        applyBudget(b, req);
        return BudgetView.of(b);
    }

    @DeleteMapping("/budget/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteBudget(@PathVariable Long id) {
        budget.delete(findBudget(id));
    }

    @PutMapping("/settings")
    @Transactional
    public Summary updateSettings(@Valid @RequestBody SettingsRequest req) {
        PlanningSettings s = loadSettings();
        s.setTotalBudget(req.totalBudget());
        settings.save(s);
        return summary();
    }

    // ---------- overview ----------

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public Summary summary() {
        List<BudgetItem> lines = budget.findAll();
        BigDecimal estimated = sum(lines.stream().map(BudgetItem::getEstimated).toList());
        BigDecimal expected = sum(lines.stream().map(BudgetItem::expected).toList());
        BigDecimal paid = sum(lines.stream().map(BudgetItem::getPaid).toList());
        BigDecimal stillToPay = expected.subtract(paid).max(BigDecimal.ZERO);
        BigDecimal total = loadSettings().getTotalBudget();
        BigDecimal left = total == null ? null : total.subtract(expected);

        Map<Category, BigDecimal[]> byCat = new EnumMap<>(Category.class);
        for (BudgetItem b : lines) {
            BigDecimal[] acc = byCat.computeIfAbsent(b.getCategory(), c -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            acc[0] = acc[0].add(b.expected());
            acc[1] = acc[1].add(b.getPaid());
        }
        List<CategoryTotal> categories = byCat.entrySet().stream()
                .map(e -> new CategoryTotal(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .sorted(Comparator.comparing(CategoryTotal::expected).reversed())
                .toList();

        LocalDate today = LocalDate.now();
        List<PlanningTask> all = tasks.findAllOrdered();
        int done = (int) all.stream().filter(PlanningTask::isDone).count();
        int overdue = (int) all.stream()
                .filter(t -> !t.isDone() && t.getDueDate() != null && t.getDueDate().isBefore(today)).count();
        List<TaskView> next = all.stream().filter(t -> !t.isDone()).limit(5).map(TaskView::of).toList();
        List<BudgetView> due = lines.stream()
                .filter(b -> b.expected().compareTo(b.getPaid()) > 0 && b.getDueDate() != null)
                .sorted(Comparator.comparing(BudgetItem::getDueDate))
                .limit(5).map(BudgetView::of).toList();

        LocalDate wedding = weddingDate();
        Long daysToGo = wedding == null ? null : ChronoUnit.DAYS.between(today, wedding);
        return new Summary(total, estimated, expected, paid, stillToPay, left, categories,
                all.size(), done, overdue, next, due, wedding, daysToGo);
    }

    // ---------- helpers ----------

    private void applyTask(PlanningTask t, TaskRequest req) {
        t.setTitle(req.title().trim());
        t.setCategory(req.category() == null ? Category.OTHER : req.category());
        t.setDueDate(req.dueDate());
        t.setAssignee(clean(req.assignee()));
        t.setNotes(clean(req.notes()));
        if (req.done() != null) markDone(t, req.done());
    }

    private static void markDone(PlanningTask t, boolean value) {
        if (value && !t.isDone()) t.setDoneAt(LocalDateTime.now());
        if (!value) t.setDoneAt(null);
        t.setDone(value);
    }

    private void applyBudget(BudgetItem b, BudgetRequest req) {
        b.setName(req.name().trim());
        b.setCategory(req.category() == null ? Category.OTHER : req.category());
        b.setVendorName(clean(req.vendorName()));
        b.setVendorPhone(clean(req.vendorPhone()));
        b.setEstimated(req.estimated());
        b.setActual(req.actual());
        b.setPaid(req.paid() == null ? BigDecimal.ZERO : req.paid());
        b.setDueDate(req.dueDate());
        b.setNotes(clean(req.notes()));
    }

    private PlanningTask findTask(Long id) {
        return tasks.findById(id).orElseThrow(() -> ApiException.notFound("Task not found"));
    }

    private BudgetItem findBudget(Long id) {
        return budget.findById(id).orElseThrow(() -> ApiException.notFound("Budget line not found"));
    }

    private PlanningSettings loadSettings() {
        return settings.findById(PlanningSettings.SINGLETON_ID).orElseGet(PlanningSettings::new);
    }

    private LocalDate weddingDate() {
        return events.findById(WeddingEvent.SINGLETON_ID)
                .map(WeddingEvent::getEventDate).map(LocalDateTime::toLocalDate).orElse(null);
    }

    private static BigDecimal sum(List<BigDecimal> values) {
        return values.stream().filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
