import { Link, useRouter } from "@tanstack/react-router";
import { User } from "better-auth";
import { type ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import { Menu } from "lucide-react";

export default function Layout(props: { user?: User; children: ReactNode }) {
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
            >
              <Menu />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <Link to="/app">App</Link>
              </li>
              <li>
                <Link to="/app/account">Account</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="navbar-center">
          <Link to="/" className="btn btn-ghost text-xl">
            TwoPi
          </Link>
        </div>
        {props.user ? (
          <div className="navbar-end">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                Hi {props.user.name}
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <button className="btn btn-primary" onClick={signOut}>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="navbar-end flex gap-4">
            <Link to="/signin" className="btn btn-primary">
              Sign in
            </Link>
            <Link to="/signup" className="btn">
              Sign up
            </Link>
          </div>
        )}
      </div>
      <div className="m-4">{props.children}</div>
    </>
  );
}
