package com.finance.category;

import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;   // Food, Transport, Entertainment, etc.

    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CategoryType type = CategoryType.DISCRETIONARY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;     // null = system default category

    public enum CategoryType {
        ESSENTIAL,
        DISCRETIONARY
    }
}
