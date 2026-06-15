package com.project.helpdesk.repository;

import com.project.helpdesk.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Integer> {
    List<ActivityLog> findTop10ByOrderByCreatedAtDesc();
}
