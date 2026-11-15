package com.kidus.wedding.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PlanningTaskRepository extends JpaRepository<PlanningTask, Long> {

    /** Open tasks first, soonest due first, undated last. */
    @Query("select t from PlanningTask t order by t.done asc, case when t.dueDate is null then 1 else 0 end, t.dueDate asc, t.id asc")
    List<PlanningTask> findAllOrdered();
}
