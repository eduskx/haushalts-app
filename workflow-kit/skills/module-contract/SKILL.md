---
name: module-contract
description: The generic rules that make a code module reusable in another app. Use when creating, changing or reviewing a package or module.
---

# Module contract

The test for every module: **could another app install this without changing it?**

## Layers

Dependencies point down only.

```
apps        Composition, theme, product-specific behaviour and wording
features    Domain modules. They never import each other
kit         Generic building blocks. They never import features
```

Inside a feature:

| Folder | Contains | May not import |
|---|---|---|
| `src/domain/` | Pure logic and types | UI framework, backend client |
| `src/data/` | Backend access. The client is passed in | UI framework |
| `src/ui/` | Components, hooks, messages | Router or bundler-specific APIs |
| `migrations/` | Append-only schema and access rules | |
| `module.ts` | Manifest: `id`, `routes`, `nav`, `homeWidgets` | |
| `README.md` | Install in three steps | |

## Rules

1. **Removing a module is one line in the app's module list, plus its dependency.** If more is needed, the module leaks.
2. **Product words stay out.** Use neutral domain words in modules, and map them to product wording through messages in the app. The project's list of banned words is in `project.config.json`.
3. **Configuration over conditionals.** A module takes options from the app. It never checks which app it is running in.
4. **No theme in modules.** Components use design tokens. The app supplies the values.
5. **All wording in message files.** No user-visible strings in code.
6. **No abstraction without a second user.** Add ports, adapters, plugins and options when a real second user appears. Reuse comes from clean boundaries, not from flexibility nobody uses.
7. **Modules bring their own tests**, and those run without the app.
8. **Shared state between features goes through the database or the kit.** Direct imports are not allowed. A feature reacts to another by reading what it recorded.

## How to decide where code goes

- Needed by one feature: in that feature.
- Needed by two features and independent of the domain: move it to the kit.
- Mentions the product, or exists only for this app: in the app.

## Proof

The rules count only if a machine enforces them: dependency rules, the banned-word check, and a second small app composed from a subset of the modules that builds in CI.
