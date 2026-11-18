package com.quickstay.email;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    List<EmailLog> findTop30ByRecipientOrderBySentAtDescIdDesc(String recipient);
    List<EmailLog> findTop50ByOrderBySentAtDescIdDesc();
}
