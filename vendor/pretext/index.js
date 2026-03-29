const React = require('react');

function Pretext({ as = 'p', width = 42, align = 'left', children, className = '', style = {} }) {
  const Comp = as;
  return React.createElement(
    Comp,
    {
      className: `pretext-block ${className}`.trim(),
      style: {
        maxWidth: `${width}ch`,
        textAlign: align,
        textWrap: 'pretty',
        lineHeight: 1.45,
        ...style
      }
    },
    children
  );
}

module.exports = { Pretext, default: Pretext };
