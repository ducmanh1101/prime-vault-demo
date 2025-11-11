import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

function HeaderLayout() {
  return (
    <div className="navbar bg-base-200 shadow-sm w-full">
      <a className="flex-1 font-bold uppercase text-xl">PRIME VAULTS TEST</a>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <DynamicWidget />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default HeaderLayout;
