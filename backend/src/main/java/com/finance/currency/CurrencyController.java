package com.finance.currency;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/rates/{base}")
    public Map<String, Object> getRates(@PathVariable String base) {
        return currencyService.getRates(base);
    }

    @GetMapping("/convert")
    public ConversionResult convert(@RequestParam String from,
                                    @RequestParam String to,
                                    @RequestParam BigDecimal amount) {
        return currencyService.convert(from, to, amount);
    }
}
