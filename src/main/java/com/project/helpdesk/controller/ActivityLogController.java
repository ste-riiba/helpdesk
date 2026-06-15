package com.project.helpdesk.controller;

import com.project.helpdesk.dto.response.ActivityLogResponse;
import com.project.helpdesk.service.ActivityLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/admin/activity")
public class ActivityLogController {
    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> findRecentActivities() {
        List<ActivityLogResponse> activities = activityLogService.findRecentActivities();

        return ResponseEntity.ok(activities);
    }
}
