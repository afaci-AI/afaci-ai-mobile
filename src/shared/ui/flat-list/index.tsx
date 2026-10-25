'use client'

// gluestack v5 has no virtualized list component. Keep the native primitive
// behind a shared entry point, as with ScrollView; rows use gluestack UI.
export { FlatList } from 'react-native'
