import React from "react";

// Named export function component
export function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>;
}

// Default export function component
function InternalCard({ title }: { title: string }) {
  return <div>{title}</div>;
}
export default InternalCard;

// Arrow function component
export const Badge = ({ label }: { label: string }) => {
  return <span>{label}</span>;
};

// memo wrapped
export const MemoButton = React.memo(function MemoButtonInner({ text }: { text: string }) {
  return <button>{text}</button>;
});

// forwardRef wrapped
export const InputField = React.forwardRef<HTMLInputElement, { placeholder: string }>(
  (props, ref) => {
    return <input ref={ref} placeholder={props.placeholder} />;
  },
);

// memo + forwardRef nested
export const FancyInput = React.memo(
  React.forwardRef<HTMLInputElement, { label: string }>((props, ref) => {
    return (
      <label>
        {props.label}
        <input ref={ref} />
      </label>
    );
  }),
);

// HOC wrapped
function withTheme<P extends object>(Component: React.ComponentType<P>) {
  return function ThemedComponent(props: P) {
    return <Component {...props} />;
  };
}

function RawHeader({ title }: { title: string }) {
  return <h1>{title}</h1>;
}
export const ThemedHeader = withTheme(RawHeader);

// Class component
export class Counter extends React.Component<{ initial: number }> {
  render() {
    return <div>{this.props.initial}</div>;
  }
}

// Near-duplicate of Button (same structure, different prop name)
export function SubmitButton({
  onSubmit,
  children,
}: {
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return <button onClick={onSubmit}>{children}</button>;
}

// Non-component export (should NOT be detected)
export function formatDate(date: Date): string {
  return date.toISOString();
}

// Non-exported local component (should NOT be detected by default)
// eslint-disable-next-line no-unused-vars
function LocalHelper() {
  return <div>helper</div>;
}
