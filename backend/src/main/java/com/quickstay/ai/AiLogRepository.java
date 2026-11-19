package com.quickstay.ai;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiLogRepository extends JpaRepository<AiLog, Long> {

    List<AiLog> findTop50ByOrderByCreatedAtDesc();

    List<AiLog> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByFallbackUsed(boolean fallbackUsed);

    @Query("SELECT AVG(l.latencyMs) FROM AiLog l")
    Double getAverageLatencyMs();

    @Query("SELECT SUM(l.promptTokens + l.completionTokens) FROM AiLog l")
    Long getTotalTokensUsed();

    @Query("SELECT l.feature, COUNT(l) FROM AiLog l GROUP BY l.feature")
    List<Object[]> countByFeatureGroup();
}
