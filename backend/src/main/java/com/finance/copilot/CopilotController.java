package com.finance.copilot;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/copilot")
@RequiredArgsConstructor
public class CopilotController {

    private final CopilotService copilotService;

    @PostMapping("/ask")
    public ResponseEntity<CopilotService.CopilotResponse> askQuestion(@RequestBody CopilotService.CopilotRequest req) {
        return ResponseEntity.ok(copilotService.answerQuestion(req));
    }
}
