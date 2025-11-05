# Commit Message Guidelines

Follow these conventions for clear, consistent commit messages that align with the project's development workflow.

## Format

```
<type>: <short summary in lowercase>

- <detailed change 1>
- <detailed change 2>
- <detailed change 3>
```

## Rules

1. **Summary line (line 1)**:
   - Start with a type prefix: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `style:`
   - Keep it concise and lowercase after the colon
   - Example: `feat: add book reservation filtering`

2. **Empty line (line 2)**:
   - MUST be completely blank (no spaces, no characters)

3. **Bullet points (line 3+)**:
   - **MANDATORY**: Include at least 2-3 bullet points describing specific changes
   - Start each with `- ` (dash and space)
   - Be specific about what changed, added, or fixed
   - Example:
     ```
     - Added filter dropdown for reservation status
     - Updated ReservationService to support status filtering
     - Added tests for new filtering functionality
     ```

## Commit Types

- `feat:` - New feature or functionality
- `fix:` - Bug fix
- `chore:` - Maintenance tasks, dependency updates
- `docs:` - Documentation changes
- `refactor:` - Code restructuring without behavior change
- `test:` - Adding or updating tests
- `style:` - Code formatting, styling changes

## ✅ Good Examples

```
feat: add overdue loan notification system

- Created NotificationJob to check for overdue loans daily
- Added email templates for overdue notifications
- Updated LoanService with overdue detection logic
- Added tests for notification scheduling
```

```
fix: resolve book search pagination issue

- Fixed off-by-one error in search pagination
- Updated BookController to handle edge cases
- Added validation for page and limit parameters
```

```
chore: upgrade express to version 5.1.0

- Updated package.json with Express 5.1.0
- Migrated deprecated middleware syntax
- Updated route handler types
- Verified all tests pass with new version
```

## ❌ Bad Examples

```
feature/books: Add search feature
```
^ Wrong: Using branch name as prefix (should use commit type like `feat:`), single line without bullet points

```
update stuff
```
^ Wrong: Too vague, no type prefix, no details

```
fix: bug in the system
```
^ Wrong: Not specific, no bullet points explaining what was fixed

## Notes

- Be descriptive but concise
- Focus on *what* changed and *why* if not obvious
- Reference issue numbers if applicable: `- Fixes #123`
- Keep commits focused on a single logical change
