import { createContext, useContext, useState, useRef } from 'react';

const BugReporterContext = createContext({
  errorData: null,
  setErrorData: () => {},
  openReporterRef: { current: null },
});

export function BugReporterProvider({ children }) {
  const [errorData, setErrorData] = useState(null);
  const openReporterRef = useRef(null);

  return (
    <BugReporterContext.Provider
      value={{ errorData, setErrorData, openReporterRef }}
    >
      {children}
    </BugReporterContext.Provider>
  );
}

export function useBugReporterContext() {
  return useContext(BugReporterContext);
}
