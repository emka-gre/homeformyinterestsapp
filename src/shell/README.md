# shell

Navigation, the capture button, routing, and the profile surfaces — everything
that is the app rather than any one hobby.

**The shell must never branch on a module id.** `if (module === 'coffee')` in
this directory is the defect the whole architecture exists to prevent, and it
is greppable. The shell learns what modules exist only by reading the registry
in `core/registry/`.

The shell may import from `core/`. It may not import from `modules/`.
