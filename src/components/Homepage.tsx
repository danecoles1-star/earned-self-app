import { Art, Page } from "../experience/ui";
export function Homepage({
  start,
  signIn,
  signedIn,
}: {
  start: (kind: "goal" | "vision") => void;
  signIn: () => void;
  signedIn: boolean;
}) {
  return (
    <Page
      layout="welcome"
      title="Become You"
      sub="Who you become starts with what you dare to do."
      footer={
        <>
          <button className="button" onClick={() => start("vision")}>
            Begin
          </button>
          <button className="quiet" onClick={signIn}>
            {signedIn ? "Return to my ambition" : "I already have an account"}
          </button>
        </>
      }
    >
      <p className="welcome-copy">
        Set the vision, take the action, and build the proof of your newly
        Earned Self.
      </p>
      <Art kind="steps" />
    </Page>
  );
}
