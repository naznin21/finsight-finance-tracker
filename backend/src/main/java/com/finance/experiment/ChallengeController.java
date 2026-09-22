package com.finance.experiment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    public ResponseEntity<List<ChallengeService.ChallengeDTO>> getActiveChallenges() {
        return ResponseEntity.ok(challengeService.getActiveChallenges());
    }

    @PostMapping
    public ResponseEntity<ChallengeService.ChallengeDTO> createChallenge(@RequestBody ChallengeService.ChallengeDTO dto) {
        return ResponseEntity.ok(challengeService.createChallenge(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChallenge(@PathVariable Long id) {
        challengeService.deleteChallenge(id);
        return ResponseEntity.noContent().build();
    }
}
