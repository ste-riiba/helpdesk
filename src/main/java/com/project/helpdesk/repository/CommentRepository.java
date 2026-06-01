package com.project.helpdesk.repository;

import com.project.helpdesk.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {
    List<Comment> findAllByTicket_Id(Integer id);

    List<Comment> findAllByAuthor_Id(Integer id);
}
