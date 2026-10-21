# Banner

Full-width message inside a panel or under the header. Variants: success (data file connected), warning (not saving to a file), danger (data file missing), neutral (template hint, dismissible).

- Always an icon plus a bold first phrase that says what is going on, then one sentence of what to do. Actions on the right as `hb-btn--secondary hb-btn--sm`.
- Replaces `DataFileBanner`, `.template-banner` styling.
- PRD v33, signed in (server is the source of truth): warning "HikingBuddy reached today's free limit." (`hourglass`) and "You are offline." (`cloud-off`) under the header. Both say that unsaved changes are kept in this browser; the limit banner has no button (nothing to do until tomorrow), the offline one has "Try again". Warning, not danger: nothing is lost.
