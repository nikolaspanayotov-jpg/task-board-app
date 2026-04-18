import React, { createContext, useContext, useMemo } from "react";
import { cn } from "../../lib/utils";

const SelectContext = createContext(null);

function extractMetadata(children, state = { options: [], placeholder: "" }) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === SelectItem) {
      state.options.push({
        value: child.props.value,
        label: child.props.children,
      });
    }

    if (child.type === SelectValue && child.props.placeholder) {
      state.placeholder = child.props.placeholder;
    }

    if (child.props.children) {
      extractMetadata(child.props.children, state);
    }
  });

  return state;
}

export function Select({ value, onValueChange, children }) {
  const metadata = useMemo(() => extractMetadata(children), [children]);

  return (
    <SelectContext.Provider
      value={{
        onValueChange,
        options: metadata.options,
        placeholder: metadata.placeholder,
        value,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, ...props }) {
  const context = useContext(SelectContext);

  if (!context) {
    return null;
  }

  return (
    <select
      value={context.value}
      onChange={(event) => context.onValueChange(event.target.value)}
      className={cn(
        "flex h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
        className
      )}
      {...props}
    >
      {context.placeholder && !context.options.some((option) => option.value === context.value) ? (
        <option value="" disabled>
          {context.placeholder}
        </option>
      ) : null}
      {context.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SelectValue() {
  return null;
}

export function SelectContent() {
  return null;
}

export function SelectItem() {
  return null;
}
