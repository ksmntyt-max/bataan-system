'use client'

import { useReducer, useCallback } from 'react'

// ── INITIAL STATE — single source of truth for map + panel state ──────────────
const INITIAL_STATE = {
  activeAsset:   null,   // which Firma asset is armed for deploy
  activeParcel:  null,   // parcel currently shown in ParcelPanel
  activeLayers: {
    heatmap:  false,
    zones:    true,
    infra:    true,
    recs:     true,
    land:     true,
    hazard:   false,
    clup:     false,
    sovereign:false,
    omnimesh: false,
    strategic:false,
    solar:    false,
    ports:    false,
    aviation: false,
    construction:false,
  },
  openPanel:    null,    // 'parcel' | 'zone' | 'calc' | null
  selectedZone: null,    // AFAB | SBFZ | null
  lastScore:    null,    // last composite score from deployed pin
  flyTarget:    null,    // { lat, lng } — triggers map.flyTo
  deployedPins: [],      // list of deployed asset pins
}

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    case 'SELECT_ASSET':
      // toggle off if same asset re-selected
      return { ...state, activeAsset: state.activeAsset === payload ? null : payload }

    case 'TOGGLE_LAYER':
      return {
        ...state,
        activeLayers: { ...state.activeLayers, [payload]: !state.activeLayers[payload] },
      }

    case 'SELECT_PARCEL':
      return { ...state, activeParcel: payload, openPanel: payload ? 'parcel' : null }

    case 'SELECT_ZONE':
      return { ...state, selectedZone: payload, openPanel: payload ? 'zone' : null }

    case 'OPEN_CALC':
      return { ...state, openPanel: 'calc' }

    case 'CLOSE_PANEL':
      return { ...state, openPanel: null, activeParcel: null, selectedZone: null }

    case 'SET_SCORE':
      return { ...state, lastScore: payload }

    case 'FLY_TO':
      return { ...state, flyTarget: payload }

    case 'ADD_PIN':
      return { ...state, deployedPins: [...state.deployedPins, payload] }

    case 'REMOVE_PIN':
      return { ...state, deployedPins: state.deployedPins.filter(p => p.id !== payload) }

    default:
      return state
  }
}

// ── HOOK ──────────────────────────────────────────────────────────────────────
export function useBLISState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const actions = {
    selectAsset:  useCallback(id     => dispatch({ type: 'SELECT_ASSET',  payload: id }),     []),
    toggleLayer:  useCallback(name   => dispatch({ type: 'TOGGLE_LAYER',  payload: name }),   []),
    selectParcel: useCallback(parcel => dispatch({ type: 'SELECT_PARCEL', payload: parcel }), []),
    selectZone:   useCallback(key    => dispatch({ type: 'SELECT_ZONE',   payload: key }),    []),
    openCalc:     useCallback(()     => dispatch({ type: 'OPEN_CALC' }),                      []),
    closePanel:   useCallback(()     => dispatch({ type: 'CLOSE_PANEL' }),                    []),
    setScore:     useCallback(score  => dispatch({ type: 'SET_SCORE',    payload: score }),   []),
    flyTo:        useCallback(target => dispatch({ type: 'FLY_TO',       payload: target }),  []),
    addPin:       useCallback(pin    => dispatch({ type: 'ADD_PIN',      payload: pin }),     []),
    removePin:    useCallback(id     => dispatch({ type: 'REMOVE_PIN',   payload: id }),      []),
  }

  return { state, actions }
}
