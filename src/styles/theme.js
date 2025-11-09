export const theme = {
  colors: {
    primary: {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      solid: "#667eea",
      dark: "#5568d3",
      light: "#8b9df8",
    },
    success: {
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      solid: "#10B981",
      light: "#D1FAE5",
    },
    danger: {
      solid: "#EF4444",
      light: "#FFE5E5",
    },
    warning: {
      solid: "#F59E0B",
      light: "#FFF9DB",
    },
    neutral: {
      black: "#000000",
      white: "#FFFFFF",
      gray50: "#F9FAFB",
      gray100: "#F3F4F6",
      gray200: "#E5E7EB",
      gray400: "#9CA3AF",
      gray600: "#666666",
    },
  },
  shadows: {
    brutal: "8px 8px 0px #000000",
    brutalMd: "6px 6px 0px #000000",
    brutalSm: "4px 4px 0px #000000",
    brutalXs: "2px 2px 0px #000000",
  },
  borders: {
    thick: "4px solid #000000",
    medium: "3px solid #000000",
    thin: "2px solid #000000",
  },
  borderRadius: {
    xl: "20px",
    lg: "16px",
    md: "12px",
    sm: "8px",
  },
  animations: {
    bounce: "bounce 0.5s ease-in-out",
    slideUp: "slideUp 0.3s ease-out",
    fadeIn: "fadeIn 0.3s ease-in",
  },
};

// Add animations to global CSS
export const globalAnimations = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  button:active {
    transform: translateY(2px);
  }
  
  button:hover {
    animation: pulse 0.5s ease-in-out;
  }
  `;
