import css from './css/scene.css'
import u from '../utils.js'
import { Block } from './Block.js'
import { modules } from '../modules/types.js'
import { Transition } from './Transition.js'

const Scene = function (sceneConfig, projectConfig, rootElement) {
  const blocks = []

  /*
    Let's notify the user about missing fields
  */
  if (!sceneConfig.blocks) {
    return console.warn('No `blocks` array found in scene ' + sceneConfig.index)
  }
  if (sceneConfig.blocks.length === 0) {
    console.warn('`blocks` is empty in scene ' + sceneConfig.index)
  }

  /*
    Set the module config from project settings
  */
  if (projectConfig.modules) {
    for (const k in projectConfig.modules) {
      if (!sceneConfig.hasOwnProperty('modules')) sceneConfig.modules = {}
      if (!sceneConfig.modules.hasOwnProperty(k)) sceneConfig.modules[k] = projectConfig.modules[k]
    }
  }

  /*
    Check if transition has been defined at project level or scene level
  */
  const hasTransition = projectConfig
    ? projectConfig.transition || sceneConfig.transition
    : sceneConfig.transition

  /*
    Create the wrapper template
  */
  let currentStep = 0
  const steps = sceneConfig.steps || []

  const child = u.div(`<div 
      class="s ${css.sceneContainer}">
      <div class="sceneObject ${css.scene}">
        <div class="${css.wrapper}">
            <div class="${css.content}">
                <div class="blocksContainer ${css.viewport}"></div>
                <div class="frontContainer ${css.fcontainer}"></div>
            </div>
        </div>
      </div>
  </div>`)

  u.globs(child, sceneConfig)
  u.props(child, sceneConfig.props)
  this.el = child

  /*
    Init modules if any
  */
  if (sceneConfig.modules) {
    for (const k in sceneConfig.modules) {
      const modConfig = sceneConfig.modules[k]
      const Mod = modules[k]
      if (!Mod) console.log(`Module "${k}" not found. Maybe you forgot to include it.`)
      if (modConfig && Mod) {
        const mod = new Mod(child.querySelector(`.${css.content}`), modConfig, sceneConfig, projectConfig)
      }
    }
  }

  /*
    Init blocks if any
  */
  const cblocks = sceneConfig.blocks
  cblocks.forEach((blockConfig, i) => {
    blockConfig.index = i
    const blocksContainer = child.querySelector('.blocksContainer')
    const block = new Block(blocksContainer, blockConfig, rootElement, projectConfig)
    blocks.push(block)
  })

  /*
    Run the entering transition
  */
  if (hasTransition) {
    const wrap = this.el.querySelector('.sceneObject')
    const dir = sceneConfig._presentatransdir === 'backward' ? 'to-left' : 'to-right'
    Transition(wrap)
      .start(dir)

    setTimeout(() => {
      Transition(wrap)
        .swap()
    }, projectConfig._transitionDestroyDelay)
  }

  /*
    Public method called by the container to init the destroy phase
  */
  this.destroyAfter = _t => {
    /*
      Run the exiting transition
    */
    if (hasTransition) {
      const wrap = this.el.querySelector('.sceneObject')
      const odir = sceneConfig._presentatransdir === 'backward' ? 'to-right' : 'to-left'
      const ndir = sceneConfig._presentatransdir === 'backward' ? 'to-left' : 'to-right'
      Transition(wrap)
        .clear(odir)
        .end(ndir)
    }

    const t = _t || 0
    blocks.forEach(block => block.beforeDestroy())

    setTimeout(() => {
      this.destroy()
      child.parentNode.removeChild(child)
    }, t)
  }

  /*
    Public method called by the container move forward the step progress
  */
  this.stepForward = () => {
    if (currentStep < steps.length) {
      const idx = steps[currentStep]
      blocks[idx].stepForward()
      currentStep++
    }
  }

  /*
    Immediate destroy for garbage collection
  */
  this.destroy = () => {
    blocks.forEach(block => block.destroy())
  }

  this.sceneConfig = sceneConfig
}

export { Scene }
