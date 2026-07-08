import { useEffect } from 'react'
import { uiTranslations } from '../data/languageData'

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA'])
const ATTRIBUTES = ['placeholder', 'title', 'aria-label']

function translateText(text, dict) {
  const trimmed = text.trim()
  if (!trimmed) return text
  const exact = dict[trimmed]
  if (exact) return text.replace(trimmed, exact)

  let output = trimmed
  Object.entries(dict).forEach(([from, to]) => {
    if (from.length > 4 && output.includes(from)) output = output.split(from).join(to)
  })
  return text.replace(trimmed, output)
}

function processNode(root, language) {
  const dict = uiTranslations[language]
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)

  nodes.forEach((node) => {
    if (!node.__travelmateOriginalText) node.__travelmateOriginalText = node.textContent
    node.textContent = language === 'en' ? node.__travelmateOriginalText : translateText(node.__travelmateOriginalText, dict || {})
  })

  root.querySelectorAll('input, button, a, select, [title], [aria-label]').forEach((node) => {
    if (node.closest('[data-no-translate]')) return
    ATTRIBUTES.forEach((attr) => {
      const value = node.getAttribute(attr)
      if (!value) return
      const key = `__travelmateOriginal_${attr}`
      if (!node[key]) node[key] = value
      node.setAttribute(attr, language === 'en' ? node[key] : translateText(node[key], dict || {}))
    })
  })
}

export default function GlobalTranslationLayer({ language }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const root = document.getElementById('root') || document.body
    const apply = () => processNode(root, language)
    apply()
    const observer = new MutationObserver(() => window.requestAnimationFrame(apply))
    observer.observe(root, { childList: true, subtree: true, attributes: true })
    return () => observer.disconnect()
  }, [language])

  return null
}
