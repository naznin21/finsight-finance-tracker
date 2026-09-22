package com.finance.currency;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    // Uses exchangerate-api.com free tier — set your key in application.properties
    @Value("${app.exchange-rate-api-key:demo}")
    private String apiKey;

    private final WebClient.Builder webClientBuilder;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRates(String baseCurrency) {
        String url = "https://v6.exchangerate-api.com/v6/" + apiKey + "/latest/" + baseCurrency.toUpperCase();
        return webClientBuilder.build()
                .get().uri(url)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @SuppressWarnings("unchecked")
    public ConversionResult convert(String from, String to, BigDecimal amount) {
        Map<String, Object> rates = getRates(from);
        Map<String, Double> conversionRates = (Map<String, Double>) rates.get("conversion_rates");
        Double rate = conversionRates.get(to.toUpperCase());
        if (rate == null) throw new RuntimeException("Unsupported currency: " + to);
        BigDecimal converted = amount.multiply(BigDecimal.valueOf(rate)).setScale(2, RoundingMode.HALF_UP);
        return new ConversionResult(from, to, amount, converted, BigDecimal.valueOf(rate));
    }
}
